import { OAuthConfig } from "next-auth/providers"

export const twitterProvider: OAuthConfig<any> = {
  id: "twitter",
  name: "Twitter",
  type: "oauth",
  version: "2.0",
  authorization: {
    url: "https://twitter.com/i/oauth2/authorize",
    params: { scope: "users.read tweet.read offline.access" },
  },
  token: "https://api.twitter.com/2/oauth2/token",
  userinfo: {
    url: "https://api.twitter.com/2/users/me",
    params: { "user.fields": "profile_image_url,name,username" },
  },
  profile(profile) {
    return {
      id: profile.data.id,
      name: profile.data.name,
      email: `${profile.data.username}@twitter.com`, // Twitter doesn't provide email by default
      image: profile.data.profile_image_url,
    }
  },
  clientId: process.env.TWITTER_CLIENT_ID || "",
  clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
}
