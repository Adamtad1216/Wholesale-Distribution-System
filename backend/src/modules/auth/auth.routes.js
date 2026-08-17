import { Router } from "express";
import {
  registerUser,
  loginUser,
  refreshUserTokens,
  logoutUser,
  getCurrentUser,
  forgotPassword,
  resetPasswordController,
} from "./auth.controller.js";
import { validate } from "../../middleware/validation.middleware.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validation.js";

const router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new customer account
 *     description: |
 *       Register as either a **PERSON** customer or an **ORGANIZATION** customer.
 *
 *       - For **PERSON**: Fill in your personal details.
 *       - For **ORGANIZATION**: Fill in your organization details and an array of contact persons who will manage the account. The first contact or the one marked `isPrimary: true` will be used for the login account.
 *
 *       The `customerType` field determines which form to use.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/PersonRegisterRequest'
 *               - $ref: '#/components/schemas/OrganizationRegisterRequest'
 *           examples:
 *             person:
 *               summary: Register as Person
 *               value:
 *                 customerType: "PERSON"
 *                 username: "adam"
 *                 password: "Adam@123"
 *                 firstName: "Adam"
 *                 middleName: "Tadesse"
 *                 lastName: "Soressa"
 *                 phone: "+251947414313"
 *                 email: "adamtadesse9@gmail.com"
 *                 address: "Ayer Tena, Addis Ababa"
 *             organization:
 *               summary: Register as Organization
 *               value:
 *                 customerType: "ORGANIZATION"
 *                 username: "clone_admin"
 *                 password: "Clone@123"
 *                 name: "Clone Technology"
 *                 registrationNumber: "REG-0000"
 *                 taxNumber: "TAX-0000"
 *                 phone: "+251922222222"
 *                 email: "clone@gmail.com"
 *                 address: "Addis Ababa, Ethiopia"
 *                 contacts:
 *                   - firstName: "Clone"
 *                     middleName: "T."
 *                     lastName: "Tech"
 *                     phone: "+251933333333"
 *                     email: "clone@gmail.com"
 *                     address: "Addis Ababa, Ethiopia"
 *                     isPrimary: true
 *     responses:
 *       201:
 *         description: Customer registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerRegistrationResponse'
 *       400:
 *         description: Validation error or username/email already taken
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       409:
 *         description: Duplicate registration number or tax number
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/register", validate(registerSchema), registerUser);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login customer or user
 *     description: Authenticate with username and password to receive access and refresh tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             adam:
 *               summary: Login
 *               value:
 *                 username: "adam"
 *                 password: "Adam@123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", validate(loginSchema), loginUser);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     description: Use a valid refresh token to get a new access token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/refresh", validate(refreshSchema), refreshUserTokens);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout user
 *     description: Invalidate the current refresh token session.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Logged out successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/logout", authenticate, logoutUser);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile including roles and permissions.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/UserSummary'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/me", authenticate, getCurrentUser);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Request password reset
 *     description: Request a password reset token for the given email address. If the email exists, a reset link will be sent.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *           examples:
 *             person:
 *               summary: Person customer email
 *               value:
 *                 email: "adamtadesse9@gmail.com"
 *             organization:
 *               summary: Organization contact email
 *               value:
 *                 email: "clone@gmail.com"
 *     responses:
 *       200:
 *         description: Reset link sent to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Reset link sent to your email
 *       404:
 *         description: Email not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to send reset email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password with token
 *     description: Reset password using the token received via email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *           examples:
 *             valid:
 *               summary: Reset with valid token
 *               value:
 *                 token: "abc123def456..."
 *                 password: "adam@1234"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPasswordController,
);

export default router;
