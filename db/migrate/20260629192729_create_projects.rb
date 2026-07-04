class CreateProjects < ActiveRecord::Migration[8.1]
  def change
    create_table :projects do |t|
      t.string :name, null: false
      t.string :key, null: false
      t.integer :ticket_counter, null: false, default: 0

      t.timestamps
    end

    add_index :projects, :key, unique: true
  end
end
