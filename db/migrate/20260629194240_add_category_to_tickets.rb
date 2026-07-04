class AddCategoryToTickets < ActiveRecord::Migration[8.1]
  def change
    # Required, no default — the creator must pick a category deliberately.
    add_column :tickets, :category, :string, null: false
    add_index :tickets, :category
  end
end
