import { useContext } from "react";
import { BranchContext } from "./BranchContext";

export function useBranch() {
  const context = useContext(BranchContext);

  if (!context) {
    throw new Error("useBranch debe utilizarse dentro de BranchProvider");
  }

  return context;
}
