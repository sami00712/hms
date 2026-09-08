import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: "ADMIN" | "RECEPTIONIST" | "DOCTOR" | "LAB" | "PHARMACIST" | "NURSE" | "MAINTENANCE";
    };
  }
  interface User {
    id: string;
    role: "ADMIN" | "RECEPTIONIST" | "DOCTOR" | "LAB" | "PHARMACIST" | "NURSE" | "MAINTENANCE";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "RECEPTIONIST" | "DOCTOR" | "LAB" | "PHARMACIST" | "NURSE" | "MAINTENANCE";
  }
}
