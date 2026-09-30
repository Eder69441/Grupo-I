import api from "./api"

export const getCategories = () => {
  return api.get("/categories")
}

export const createCategory = (category) => {
  return api.post("/categories", category)
}

export const deleteCategory = (id) => {
  return api.delete(`/categories/${id}`)
}