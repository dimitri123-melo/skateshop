import { auth, currentUser } from "@clerk/nextjs/server"

export type UserRole = "admin" | "seller" | "customer"

export async function getUserRole(): Promise<UserRole> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return "customer"

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role === "admin") return "admin"
  if (role === "seller") return "seller"
  return "customer"
}

export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  return userId
}

export async function requireRole(requiredRole: UserRole) {
  const userId = await requireAuth()
  const role = await getUserRole()

  const roleHierarchy: Record<UserRole, number> = {
    admin: 3,
    seller: 2,
    customer: 1,
  }

  if (roleHierarchy[role] < roleHierarchy[requiredRole]) {
    throw new Error("Insufficient permissions")
  }

  return { userId, role }
}

export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole()
  return role === "admin"
}

export async function isSeller(): Promise<boolean> {
  const role = await getUserRole()
  return role === "admin" || role === "seller"
}

export async function getCurrentUserWithRole() {
  const user = await currentUser()
  if (!user) return null

  const role = await getUserRole()

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.emailAddresses[0]?.emailAddress,
    imageUrl: user.imageUrl,
    role,
  }
}
