import {
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    ParseIntPipe, // Use built-in pipe for ID validation
    Post,
    Put,
    Query,
    Req,
    UseGuards, // Assuming you use Guards for authentication
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
    ApiBearerAuth, // If using Bearer token auth
  } from '@nestjs/swagger';
  
  import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto'; // Adjust path as needed
  import { CreateRecipeDTO, UpdateRecipeDTO } from './create-recipes.dto'; // Use separate DTOs if needed later
  import { RecipesService } from './recipes.service';
  import { Recipe } from './recipes.entity'; // Import the singular Recipe entity
  
  @ApiTags('recipes') // Swagger tag
  @ApiBearerAuth() // Indicate that endpoints require Bearer token authentication
  
  @Controller('recipes') // Route prefix is '/recipes'
  export class RecipesController {
    constructor(private readonly recipesService: RecipesService) {}
  
    @Post()
    @ApiOperation({ summary: 'Create a new recipe' })
    @ApiResponse({ status: 201, description: 'Recipe created successfully.', type: Recipe })
    @ApiResponse({ status: 400, description: 'Bad Request (validation failed)' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async create(
      @Req() request: Request,
      @Body() createRecipeDTO: CreateRecipeDTO,
    ): Promise<Recipe> {
      const userJwtPayload: JwtPayloadDto = request['user'];
      // Create a new entity instance
      const recipe = new Recipe();
      // Map DTO properties to entity properties
      recipe.name = createRecipeDTO.name;
      recipe.description = createRecipeDTO.description;
      recipe.ingredients = createRecipeDTO.ingredients;
      recipe.instructions = createRecipeDTO.instructions;
      recipe.prepTime = createRecipeDTO.prepTime;
      recipe.cookTime = createRecipeDTO.cookTime;
      recipe.servings = createRecipeDTO.servings; // Will be undefined if not provided
      recipe.imageUrl = createRecipeDTO.imageUrl; // Will be undefined if not provided
      recipe.user_id = userJwtPayload.sub; // Assign user ID from JWT
  
      return await this.recipesService.save(recipe);
    }
  
    @Get()
    @ApiOperation({ summary: 'Get all recipes for the logged-in user (paginated)' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number for pagination' })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Number of items per page' })
    @ApiResponse({ status: 200, description: 'List of recipes retrieved successfully.', type: [Recipe] })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async findAll(
      @Req() request: Request,
      @Query('page') page: string = '1', // Query params are initially strings
      @Query('limit') limit: string = '10',
    ): Promise<Recipe[]> {
      const userJwtPayload: JwtPayloadDto = request['user'];
      // Parse query parameters to numbers, providing defaults
      const pageNumber = parseInt(page, 10) || 1;
      const limitNumber = parseInt(limit, 10) || 10;
      return await this.recipesService.findByUserId(userJwtPayload.sub, pageNumber, limitNumber);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get a specific recipe by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'ID of the recipe to retrieve' })
    @ApiResponse({ status: 200, description: 'Recipe details retrieved successfully.', type: Recipe })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Recipe not found or not owned by user' })
    async findOne(
      @Req() request: Request,
      @Param('id', ParseIntPipe) id: number, // Use ParseIntPipe for validation/conversion
    ): Promise<Recipe> {
      const userJwtPayload: JwtPayloadDto = request['user'];
      const recipe = await this.recipesService.findByUserIdAndRecipeId(userJwtPayload.sub, id);
      // Check if a valid recipe was found (using the service's logic)
      if (!recipe) { // Service returns null if not found
        throw new NotFoundException(`Recipe with ID ${id} not found or access denied.`);
      }
      return recipe;
    }
  
    @Put(':id')
    @ApiOperation({ summary: 'Update an existing recipe' })
    @ApiParam({ name: 'id', type: Number, description: 'ID of the recipe to update' })
    @ApiResponse({ status: 200, description: 'Recipe updated successfully.', type: Recipe })
    @ApiResponse({ status: 400, description: 'Bad Request (validation failed)' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Recipe not found or not owned by user' })
    async updateOne(
      @Req() request: Request,
      @Param('id', ParseIntPipe) id: number,
      @Body() updateRecipeDTO: UpdateRecipeDTO, // Can reuse CreateRecipeDTO or use a specific Update DTO
    ): Promise<Recipe> {
      const userJwtPayload: JwtPayloadDto = request['user'];
      // First, verify the recipe exists and belongs to the user
      const existingRecipe = await this.recipesService.findByUserIdAndRecipeId(userJwtPayload.sub, id);
      if (!existingRecipe) {
        throw new NotFoundException(`Recipe with ID ${id} not found or access denied.`);
      }
  
      // Update the existing recipe entity with new data from DTO
      existingRecipe.name = updateRecipeDTO.name;
      existingRecipe.description = updateRecipeDTO.description;
      existingRecipe.ingredients = updateRecipeDTO.ingredients;
      existingRecipe.instructions = updateRecipeDTO.instructions;
      existingRecipe.prepTime = updateRecipeDTO.prepTime;
      existingRecipe.cookTime = updateRecipeDTO.cookTime;
      existingRecipe.servings = updateRecipeDTO.servings;
      existingRecipe.imageUrl = updateRecipeDTO.imageUrl;
      // user_id, created_at remain the same, updated_at is handled by TypeORM
  
      return await this.recipesService.save(existingRecipe); // Save the updated entity
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a recipe by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'ID of the recipe to delete' })
    @ApiResponse({ status: 204, description: 'Recipe deleted successfully (No Content)' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Recipe not found or not owned by user' })
    async deleteOne(
      @Req() request: Request,
      @Param('id', ParseIntPipe) id: number,
    ): Promise<void> { // Return void for DELETE typically
      const userJwtPayload: JwtPayloadDto = request['user'];
      // Verify existence and ownership before deleting
      const recipe = await this.recipesService.findByUserIdAndRecipeId(userJwtPayload.sub, id);
      if (!recipe) {
        throw new NotFoundException(`Recipe with ID ${id} not found or access denied.`);
      }
  
      await this.recipesService.deleteById(id);
      // No need to return anything, successful deletion implies 204 No Content
    }
  }