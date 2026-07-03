import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { signAccessToken } from '../services/jwt.service.js';
import { asyncHandler } from '../middlewares/errorMiddleware.js';
import nodemailer from 'nodemailer';

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const ALLOWED_ROLES = ['admin', 'produtor'];

// passwordHash e role internos nunca devem vazar em respostas públicas.
function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email e password são obrigatórios' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'password deve conter ao menos 6 caracteres' });
  }

  const normalizedRole = role ?? 'produtor';
  if (!ALLOWED_ROLES.includes(normalizedRole)) {
    return res.status(400).json({ message: 'role inválida. Use: admin ou produtor' });
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: 'E-mail já cadastrado' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role: normalizedRole });
  return res.status(201).json(sanitizeUser(user));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email e password são obrigatórios' });
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  const accessToken = signAccessToken(user);
  return res.json({
    accessToken,
    tokenType: 'Bearer',
    user: sanitizeUser(user),
  });
});

// Dados do usuário autenticado (a partir do token).
export const me = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.authUser.id);
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  return res.json(sanitizeUser(user));
});

// Recuperação de senha
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'O e-mail é obrigatório.' });
  }

  // 1. Verifica se o usuário existe no banco
  const user = await User.findOne({ where: { email } });
  
  // Segurança: Mesmo se não existir, respondemos com sucesso para evitar que maliciosos descubram e-mails válidos
  if (!user) {
    return res.status(200).json({ message: 'Se o e-mail existir, as instruções foram enviadas.' });
  }

  // 2. Cria o token simulado associado ao ID do usuário e data atual
  const timestamp = Date.now();
  const token = `simulacao-token-${user.id}-${timestamp}`;

  // 3. CONFIGURAÇÃO DO CARTEIRO (SMTP)
  // IMPORTANTE: Para usar o Gmail aqui, você precisará gerar uma "Senha de App" nas configurações da sua conta Google.
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true para porta 465
    auth: {
      user: process.env.EMAIL_USER, // <-- Coloque seu e-mail aqui
      pass: process.env.EMAIL_PASS,          // <-- Coloque sua "Senha de App" do Google aqui
    },
  });

  // Link que o usuário vai clicar (Aponta para o seu Front-end local)
  const linkRecuperacao = `${frontendUrl}/reset-password?token=${token}`;

  // 4. CORPO DO E-MAIL EM HTML
  const mailOptions = {
    from: `"AgroInsight" <${process.env.EMAIL_USER}>`,
    to: user.email, 
    subject: 'Recuperação de Palavra-passe - AgroInsight',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded-size: 8px;">
        <h2 style="color: #15803d; text-align: center;">AgroInsight</h2>
        <p>Olá,</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta no AgroInsight.</p>
        <p>Para prosseguir com a recuperação, clique no botão abaixo:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${linkRecuperacao}" style="background-color: #15803d; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Redefinir Minha Senha</a>
        </div>
        <p style="color: #666; font-size: 12px;">Se você não solicitou esta alteração, ignore este e-mail.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
        <p style="color: #999; font-size: 11px; text-align: center;">AgroInsight © 2026</p>
      </div>
    `,
  };

  try {
    // 5. ENVIA O E-MAIL DE FATO
    await transporter.sendMail(mailOptions);
    
    // Força um log no terminal para termos certeza de que passou por aqui
    console.log(`✅ E-mail de recuperação enviado com sucesso para: ${user.email}`);

    return res.status(200).json({ message: 'E-mail enviado com sucesso!' });
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error);
    return res.status(500).json({ message: 'Erro ao enviar o e-mail de recuperação.' });
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'A senha deve conter ao menos 6 caracteres.' });
  }

  try {
    // Extrai o ID do usuário de dentro do nosso token simulado
    // "simulacao-token-ID-TIMESTAMP" -> dividimos por '-' e pegamos a posição 2
    const parts = token.split('-');
    const userId = parts[2]; 

    // Busca o usuário no banco
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(400).json({ message: 'Token inválido ou usuário não encontrado.' });
    }

    // Criptografa a nova senha (exatamente como no registro)
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Salva a nova senha no banco de dados
    user.passwordHash = passwordHash;
    await user.save();

    return res.status(200).json({ message: 'Senha redefinida com sucesso!' });
  } catch (error) {
    return res.status(400).json({ message: 'Token inválido ou expirado.' });
  }
});
