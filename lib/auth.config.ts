import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/guru/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnGuruPages = nextUrl.pathname.startsWith("/guru");
      const isOnLoginPage = nextUrl.pathname === "/guru/login";

      if (isOnLoginPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/guru/dashboard", nextUrl));
        }
        return true;
      }

      if (isOnGuruPages) {
        if (isLoggedIn) return true;
        return false;
      }

      return true;
    },
  },
  providers: [],
};
