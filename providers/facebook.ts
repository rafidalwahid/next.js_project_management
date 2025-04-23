import { OAuthConfig } from "next-auth/providers"

export const facebookProvider: OAuthConfig<any> = {
  id: "facebook",
  name: "Facebook",
  type: "oauth",
  authorization: "https://www.facebook.com/v18.0/dialog/oauth?scope=email",
  token: "https://graph.facebook.com/v18.0/oauth/access_token",
  userinfo: {
    url: "https://graph.facebook.com/me",
    params: { fields: "id,name,email,picture" },
    async request({ tokens, client, provider }) {
      const { access_token } = tokens
      return await client.userinfo(tokens, {
        params: provider.userinfo?.params,
      })
    },
  },
  profile(profile) {
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      image: profile.picture?.data?.url,
    }
  },
  clientId: process.env.FACEBOOK_CLIENT_ID || "",
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
}
