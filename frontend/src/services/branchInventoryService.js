import api from "./api";

export const getBranchInventory = async (branchId) => {
  const response = await api.get("/branch-inventory", {
    params: { branchId },
  });

  return response.data;
};
