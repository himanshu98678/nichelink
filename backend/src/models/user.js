const buildUserResponse = (user) => ({
  id: user.id,
  name: user.name,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  coverImage: user.coverImage,
  bio: user.bio,
  skills: user.skills || [],
  socialLinks: user.socialLinks || null,
  experience: user.experience || null,
  education: user.education || null,
  portfolioLinks: user.portfolioLinks || [],
  visibility: user.visibility || "public",
  role: user.role,
  isVerified: user.isVerified,
  subscription: user.subscription
    ? {
        planCode: user.subscription.planCode,
        status: user.subscription.status,
        endsAt: user.subscription.endsAt,
      }
    : null,
  isPro: Boolean(
    user.subscription?.planCode === "PRO" &&
      user.subscription?.status === "ACTIVE"
  ),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

module.exports = {
  buildUserResponse,
};
