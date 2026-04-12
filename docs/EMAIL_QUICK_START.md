# 🚀 EMAIL SETUP - QUICK START (5 MINUTES)

## Step 1: Setup Gmail (Development - FREE)

### 1.1 Enable 2-Step Verification
1. Go to: https://myaccount.google.com/security
2. Scroll down to "2-Step Verification"
3. Follow the prompts to enable it

### 1.2 Create App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select: **Mail** and **Windows Computer**
3. Click "Generate"
4. Copy the 16-character password (spaces included)

### 1.3 Update Backend .env
Edit: `backend/.env`

```env
# Email Configuration
EMAIL_PROVIDER=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM=noreply@intentmarketplace.com
```

**Example:**
```env
EMAIL_USER=john.doe@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM=noreply@intentmarketplace.com
```

---

## Step 2: Test Email Sending

### 2.1 Restart Backend Server
```bash
# Stop backend (Ctrl+C in terminal)
# Restart it
cd backend
npm start
```

You should see:
```
✨ Server running on http://localhost:5000
```

### 2.2 Register a Test User
Go to http://localhost:3001

1. Click **"Register"**
2. Fill in form:
   - **Name:** Test User
   - **Email:** any-email@gmail.com (use a real email you can access)
   - **Password:** SecurePass123
   - **Confirm:** SecurePass123
3. Click **"Create Account"**

### 2.3 Check Your Email Inbox
Within 30 seconds, you should receive an email:
- **Subject:** ✉️ Verify Your Email - Intent Marketplace
- **Contains:** 6-digit OTP code
- **From:** noreply@intentmarketplace.com

---

## Step 3: Complete Verification Flow

### 3.1 Enter OTP on Verification Page
1. You're now on `/verify-otp?email=...` page
2. Check the email you received
3. Copy the 6-digit OTP
4. Paste it into the form
5. Click "Verify OTP"

### 3.2 You Should Get:
- ✅ "Email Verified!" success screen
- ✅ Welcome email in your inbox
- ✅ Auto-redirect to login page

### 3.3 Login
1. Use email and password from registration
2. You're now logged in! 🎉

---

## Step 4: Test Password Reset

### 4.1 Request Password Reset
1. Click "Forgot password?" on login page
2. Enter your email
3. Click "Send Reset Link"

### 4.2 Check Email
You should receive:
- **Subject:** 🔐 Reset Your Password - Intent Marketplace
- **Contains:** 6-digit OTP code and reset link

### 4.3 Reset Password
1. Go to form (or click reset link)
2. Enter OTP from email
3. Enter new password (must be 8+ characters, uppercase, number)
4. Click "Reset Password"
5. Login with new password ✅

---

## ✅ Verification Checklist

After completing above steps:

- [ ] Backend running without errors
- [ ] Registered new user
- [ ] Received OTP verification email
- [ ] Successfully verified OTP
- [ ] Received welcome email
- [ ] Logged in successfully
- [ ] Can access dashboard
- [ ] Tested password reset flow
- [ ] Received all emails within 30 seconds

---

## 🧪 All Email Types (Check Your Inbox)

You should have received:

1. **OTP Verification Email**
   - Sent on registration
   - Contains: 6-digit OTP (expires in 5 min)
   - Allows you to verify your email

2. **Welcome Email**
   - Sent after OTP verification
   - Contains: Welcome message + feature overview
   - Confirmation that account is active

3. **Password Reset Email**
   - Sent when clicking "Forgot password?"
   - Contains: 6-digit OTP + reset link
   - Allows you to set new password

---

## ❌ Troubleshooting

### Email Not Arriving?

**Check 1: Is backend running?**
```
✨ Server running on http://localhost:5000
```
If not, restart: `cd backend && npm start`

**Check 2: Is Gmail configured correctly?**
- Go to backend/.env
- EMAIL_USER must be your Gmail address
- EMAIL_PASSWORD must be the 16-character App Password
- EMAIL_PROVIDER must be "gmail"

**Check 3: Check spam folder**
- Gmail may put emails in spam
- Move from spam to inbox
- Gmail will learn to trust sender

**Check 4: Check backend console**
```
✅ OTP email sent to test@gmail.com. Message ID: xxx
```
If you see this, email was sent successfully. It's a delivery issue, not a sending issue.

**Check 5: Restart backend**
```bash
# Press Ctrl+C to stop
# Run again
npm start
```

### Gmail App Password Not Working?

1. Go to https://myaccount.google.com/apppasswords
2. Make sure 2-Step Verification is **enabled**
3. If you don't see "App passwords" option:
   - Enable 2-Step Verification first
   - Then try again

### Backend Shows Error: "Email service not configured"

This means:
```env
EMAIL_PROVIDER=gmail
# But EMAIL_USER or EMAIL_PASSWORD is missing
```

Fix: Add both `EMAIL_USER` and `EMAIL_PASSWORD` to `.env`

---

## 🎯 Next Steps

### For Production (Later)
When deploying to production:

1. **Switch from Gmail to SendGrid:**
   - Create SendGrid account (free tier available)
   - Get API key
   - Update .env:
     ```env
     EMAIL_PROVIDER=sendgrid
     SENDGRID_API_KEY=SG.xxxxx
     ```

2. **Setup Domain:**
   - Verify your company domain with SendGrid
   - Better deliverability

3. **Monitor Emails:**
   - SendGrid dashboard shows delivery stats
   - Monitor bounce rates
   - Track open/click rates

---

## 📱 Test with Different Email Services

You can setup multiple email services and switch by changing `EMAIL_PROVIDER` in `.env`:

- **Gmail** (Free, development)
- **SendGrid** (Professional, production)
- **Custom SMTP** (Self-hosted mail server)
- **Mailtrap** (Free testing service)

---

**You're all set! Start sending emails! 🚀**

If you have any issues, refer to the full guide in `EMAIL_DEPLOYMENT_GUIDE.md`
