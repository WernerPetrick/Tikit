class CreateColumns < ActiveRecord::Migration[8.1]
  def change
    create_table :columns do |t|
      t.string :name, null: false
      t.integer :position, null: false
      t.references :project, null: false, foreign_key: true

      t.timestamps
    end

    add_index :columns, [:project_id, :position]
  end
end
