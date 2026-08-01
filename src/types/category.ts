export interface Category {
  _id: string;
  tripId: string;
  name: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  boardId?: string;
  tripId?: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
}
