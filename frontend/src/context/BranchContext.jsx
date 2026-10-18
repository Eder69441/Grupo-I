import { useEffect, useState } from "react";
import  useAuth  from "./useAuth";
import { BranchContext } from "./BranchContext";

import { setApiBranch, clearApiBranch } from "../services/api";

export function BranchProvider({ children }) {
  const { user } = useAuth();

  const [adminSelection, setAdminSelection] = useState(null);

  const isAdmin = user?.role === "admin";

  const assignedBranchId =
    user?.branch && typeof user.branch === "object"
      ? user.branch._id
      : user?.branch || null;

  const currentUserId = String(user?._id ?? user?.id ?? "");

  const selectedBranchId = isAdmin
    ? adminSelection?.userId === currentUserId
      ? adminSelection.branchId
      : assignedBranchId
    : assignedBranchId;

  useEffect(() => {
    if (selectedBranchId) {
      setApiBranch(selectedBranchId);
    } else {
      clearApiBranch();
    }

    return () => {
      clearApiBranch();
    };
  }, [selectedBranchId]);

  const changeBranch = (branchId) => {
    if (!isAdmin) return;

    setAdminSelection({
      userId: currentUserId,
      branchId,
    });
  };

  return (
    <BranchContext.Provider
      value={{
        selectedBranchId,
        assignedBranchId,
        changeBranch,
        isAdmin,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}
