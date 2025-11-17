import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import loginRoute from "./routes/auth/login/route";
import registerRoute from "./routes/auth/register/route";
import meRoute from "./routes/auth/me/route";
import logoutRoute from "./routes/auth/logout/route";
import listUsersRoute from "./routes/users/list/route";
import approveUserRoute from "./routes/users/approve/route";
import rejectUserRoute from "./routes/users/reject/route";

console.log('🔧 Creating appRouter with routes:', {
  loginRoute: !!loginRoute,
  registerRoute: !!registerRoute,
  meRoute: !!meRoute,
  logoutRoute: !!logoutRoute,
  listUsersRoute: !!listUsersRoute,
  approveUserRoute: !!approveUserRoute,
  rejectUserRoute: !!rejectUserRoute,
});

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    login: loginRoute,
    register: registerRoute,
    me: meRoute,
    logout: logoutRoute,
  }),
  users: createTRPCRouter({
    list: listUsersRoute,
    approve: approveUserRoute,
    reject: rejectUserRoute,
  }),
});

console.log('✅ appRouter created successfully');

export type AppRouter = typeof appRouter;