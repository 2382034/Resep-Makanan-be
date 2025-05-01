import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    ManyToOne, // If you want to link back to a User entity
    JoinColumn, // If you want to link back to a User entity
  } from 'typeorm';
  // Assuming you have a User entity, import it if you want the relation
  // import { User } from '../user/user.entity';
  
  @Entity('recipes') // Database table name will be 'recipes'
  export class Recipe { // Class name is singular 'Recipe'
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    user_id: number; // Stores the ID of the user who owns the recipe
  
    // Optional: If you have a User entity and want a proper relation
    // @ManyToOne(() => User) // Define the relationship type
    // @JoinColumn({ name: 'user_id' }) // Specify the foreign key column name
    // user: User; // Property to access the related User object
  
    @Column()
    name: string;
  
    @Column('text') // Use 'text' for potentially longer descriptions
    description: string;
  
    @Column('text') // Use 'text' for potentially long ingredient lists
    ingredients: string;
  
    @Column('text') // Use 'text' for potentially long instructions
    instructions: string;
  
    @Column({ type: 'int' }) // Explicitly integer type
    prepTime: number; // in minutes
  
    @Column({ type: 'int' }) // Explicitly integer type
    cookTime: number; // in minutes
  
    @Column({ type: 'int', nullable: true }) // Optional field
    servings?: number;
  
    @Column({ type: 'varchar', length: 2048, nullable: true }) // Store URL, nullable
    imageUrl?: string;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  }