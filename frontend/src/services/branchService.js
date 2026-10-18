import api from "./api";

export const getBranches = async () => {
  const response = await api.get("/branches");
  return response.data;
};

export const getBranchById = async (id) => {
  const branches = await getBranches();
  return branches.find((branch) => branch._id === id) ?? null;
};
