import jwt, { SignOptions } from 'jsonwebtoken';

// Define the shape of your token payload
interface TokenPayload {
  userId: string;
  role: string;
  email?: string;
}

export function parseJwtExpiration(expiresIn: string | number): string | number {
  if (typeof expiresIn === 'number') {
    return expiresIn;
  }

  // If it's already a valid timespan string (like "1d"), return as-is
  if (/^(\d+)([smhdwMy])$/.test(expiresIn)) {
    return expiresIn;
  }

  // Try to convert to number (seconds)
  const seconds = Number(expiresIn);
  if (!isNaN(seconds)) {
    return seconds;
  }

  // Default fallback (1 day)
  return '1d';
}


function generateToken(user: {
  id: string;
  role: string;
  email?: string;
}): string {
  // Prepare the payload
  const payload: TokenPayload = {
    userId: user.id,
    role: user.role,
    email: user.email
  };

  // Ensure JWT_SECRET is defined
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  // Define token options
  const options: SignOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN as unknown as number || '8h', // Default to 1 hour if not specified
    algorithm: 'HS256' // Specify the algorithm
  };

  // Generate and return the token
  return jwt.sign(payload, secret, options);
}

// Example usage
function loginUser(user: { id: string; role: string; email?: string }) {
  try {
    const token = generateToken(user);
    return token;
  } catch (error) {
    console.error('Token generation failed:', error);
    throw new Error('Failed to generate authentication token');
  }
}

// Verify token function
function verifyToken(token: string) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}

export { generateToken, verifyToken };