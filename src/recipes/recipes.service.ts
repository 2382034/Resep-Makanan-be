import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from './recipes.entity'; // Import the Recipe entity

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe) // Inject the Recipe repository
    private recipesRepository: Repository<Recipe>,
  ) {}

  /**
   * Saves (creates or updates) a recipe.
   * @param recipe The recipe entity to save.
   * @returns The saved recipe entity.
   */
  async save(recipe: Recipe): Promise<Recipe> {
    return this.recipesRepository.save(recipe);
  }

  /**
   * Finds recipes belonging to a specific user with pagination.
   * @param userId The ID of the user.
   * @param page The page number (1-based).
   * @param limit The number of items per page.
   * @returns A promise resolving to an array of recipes.
   */
  async findByUserId(
    userId: number,
    page: number,
    limit: number,
  ): Promise<Recipe[]> {
    // Basic validation for page and limit
    const skip = (page > 0 ? page - 1 : 0) * limit;
    const take = limit > 0 ? limit : 10; // Default limit if invalid

    return await this.recipesRepository.find({
      where: { user_id: userId },
      skip: skip,
      take: take,
      order: {
        created_at: 'DESC', // Order by creation date, newest first
      },
    });
  }

  /**
   * Finds a single recipe by its ID, ensuring it belongs to the specified user.
   * @param userId The ID of the user.
   * @param recipeId The ID of the recipe.
   * @returns The found recipe entity, or null if not found or not owned by the user.
   */
  async findByUserIdAndRecipeId(userId: number, recipeId: number): Promise<Recipe | null> {
    // Find one recipe matching both user_id and recipe id
    const recipe = await this.recipesRepository.findOne({
      where: {
        user_id: userId,
        id: recipeId,
      },
    });
    // Return the found recipe or null if it doesn't exist/match criteria
    return recipe || null;
  }

  /**
   * Deletes a recipe by its ID. Ownership should be checked *before* calling this.
   * @param recipeId The ID of the recipe to delete.
   * @returns A promise resolving when the deletion is complete.
   */
  async deleteById(recipeId: number): Promise<void> {
    const result = await this.recipesRepository.delete({ id: recipeId });
    // Optionally check if any rows were affected, though the controller already verified existence
    if (result.affected === 0) {
        // This shouldn't happen if the controller logic is correct, but good for robustness
        throw new NotFoundException(`Recipe with ID ${recipeId} could not be deleted (possibly already removed).`);
    }
  }
}