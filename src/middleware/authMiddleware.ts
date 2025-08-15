import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Include the user object
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // 1. Get the Authorization header
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "No token provided, authorization denied" });
  }

  // 2. Check if it starts with 'Bearer '
  const tokenParts = authHeader.split(" ");
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    return res
      .status(401)
      .json({ message: "Invalid token format. Expected: Bearer <token>" });
  }

  // 3. Extract the actual token
  const token = tokenParts[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "No token found after Bearer, authorization denied" });
  }

  // Verify token
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET not defined in environment variables");
    }

    const decoded = jwt.verify(token, secret) as {
      id: string;
      username: string;
      email: string;
    };

    // Add user from payload
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

export default authMiddleware;
