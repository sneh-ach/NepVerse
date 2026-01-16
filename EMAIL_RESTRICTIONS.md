# Email Delivery Restrictions Explained

## Why Password Reset Emails Work for Some Addresses But Not Others

If password reset emails are working for `20356sneh@gmail.com` but not for other email addresses, here are the most likely reasons:

### 1. **Resend Free Tier Restrictions**

Resend's free tier has some limitations:
- **100 emails per day** limit
- **Only verified email addresses** can receive emails in some cases
- **Domain restrictions** - emails from `onboarding@resend.dev` may have delivery issues

**Solution**: 
- Check your Resend dashboard for daily email count
- Verify the email addresses you want to send to in Resend dashboard
- Consider upgrading to a paid plan for better deliverability

### 2. **Email Provider Filtering (Gmail, Outlook, etc.)**

Different email providers have different spam filters:
- **Gmail** is generally more lenient with emails from Resend
- **Corporate emails** (company domains) often have stricter filters
- **Some providers** block emails from `onboarding@resend.dev` more aggressively

**Why `20356sneh@gmail.com` works:**
- Gmail is generally more accepting of transactional emails
- The address might have interacted with Resend emails before
- Gmail's spam filters might be more lenient for that specific address

**Solution**:
- Check spam folders for other email addresses
- Add `onboarding@resend.dev` to contacts/whitelist
- Verify your domain in Resend for better deliverability

### 3. **Email Address Verification in Resend**

Resend may require email addresses to be verified before sending:
- Some email services require recipient verification
- Unverified addresses might be blocked or filtered

**Check in Resend Dashboard**:
1. Go to https://resend.com/dashboard
2. Check if there are any verification requirements
3. Look for any blocked or bounced emails

### 4. **Rate Limiting Per Email Address**

Your application has rate limiting that might affect multiple requests:
- **Rate limit**: Prevents too many password reset requests
- **Per IP address**: Limits apply per IP, not per email
- **Per email**: Some services limit emails to the same address

**Solution**:
- Wait a few minutes between password reset requests
- Check server logs for rate limit messages

### 5. **Database User Existence**

The code checks if a user exists in the database:
```typescript
const user = await db.user.findByEmail(email)
if (!user) {
  // Returns success message but doesn't send email
  return NextResponse.json({
    message: 'If an account with that email exists, we\'ve sent a password reset link.',
  })
}
```

**Important**: If the email address doesn't exist in your database, the code will return a success message but won't actually send an email (security best practice).

**Solution**:
- Make sure the email address is registered in your database
- Check if the user account exists before requesting password reset

### 6. **Spam Folder Differences**

Different email addresses might have different spam filter settings:
- Personal Gmail: More lenient
- Corporate email: Stricter filters
- New email addresses: More likely to go to spam

**Solution**:
- Always check spam/junk folders
- Mark emails as "Not Spam" to train filters
- Add sender to contacts/whitelist

## How to Test with Different Email Addresses

1. **Check if user exists in database**:
   - Make sure the email is registered
   - Verify the email in your user database

2. **Check Resend dashboard**:
   - Go to https://resend.com/emails
   - Look for the email you sent
   - Check delivery status (Delivered, Bounced, Blocked)

3. **Check spam folders**:
   - Look in spam/junk for all email addresses
   - Mark as "Not Spam" if found

4. **Test with different providers**:
   - Try Gmail, Outlook, Yahoo, etc.
   - Some providers are more strict than others

5. **Check server logs**:
   - Look for `[Password Reset] ✅ Email sent!` messages
   - Check for any error messages

## Most Likely Reason

Based on your situation, the most likely reason is:

**Gmail (`20356sneh@gmail.com`) is more accepting of emails from Resend**, while other email providers or addresses might be:
- Filtering emails to spam
- Blocking emails from `onboarding@resend.dev`
- Requiring domain verification

## Solutions

### Short-term (Quick Fix):
1. Check spam folders for all email addresses
2. Add `onboarding@resend.dev` to contacts/whitelist
3. Mark emails as "Not Spam" to train filters

### Long-term (Best Solution):
1. **Verify your domain in Resend**:
   - Go to Resend dashboard → Domains
   - Add your domain (e.g., `nepverse.com`)
   - Add DNS records
   - Update `.env`: `EMAIL_FROM="NepVerse <noreply@nepverse.com>"`

2. **Upgrade Resend plan** (if needed):
   - Free tier: 100 emails/day
   - Paid plans: Better deliverability, higher limits

3. **Set up SPF/DKIM records**:
   - Improves email deliverability
   - Reduces spam filtering
   - Required for production

## Code Doesn't Restrict Email Addresses

**Important**: The code itself doesn't restrict which email addresses can receive emails. The validation only checks:
- Email format is valid (`z.string().email()`)
- User exists in database
- Rate limits aren't exceeded

Any restrictions are from:
- Resend service limits
- Email provider spam filters
- Domain verification requirements

## Next Steps

1. ✅ Check Resend dashboard for delivery status of all emails
2. ✅ Check spam folders for all email addresses
3. ✅ Verify domain in Resend (for production)
4. ✅ Test with different email providers
5. ✅ Check server logs for any errors
