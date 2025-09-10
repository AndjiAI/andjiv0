export const getReferralLink = (referralCode: string): string =>
  `${process.env.NEXT_PUBLIC_andji_APP_URL}/referrals/${referralCode}`
