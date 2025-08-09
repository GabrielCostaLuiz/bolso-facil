// // import { type NextRequest, NextResponse } from "next/server";
// // import { stackServerApp } from "./stack";

// import { type NextRequest, NextResponse } from "next/server";
// import { stackServerApp } from "./stack";

// export async function middleware(request: NextRequest) {
//   const user = await stackServerApp.getUser();

//   if (
//     !user &&
//     !request.nextUrl.pathname.startsWith("/login") &&
//     !request.nextUrl.pathname.startsWith("/handler/oauth-callback")
//   ) {
//     return NextResponse.redirect(new URL("/login", request.url));
//   }

//   if (user && request.nextUrl.pathname.startsWith("/login")) {
//     return NextResponse.redirect(new URL("/", request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * Feel free to modify this pattern to include more paths.
//      */
//     "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
//   ],
// };

import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/db/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
