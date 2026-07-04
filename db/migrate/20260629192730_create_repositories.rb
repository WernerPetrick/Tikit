class CreateRepositories < ActiveRecord::Migration[8.1]
  def change
    create_table :repositories do |t|
      t.bigint :github_repo_id, null: false
      t.string :full_name, null: false
      t.references :project, null: false, foreign_key: true

      t.timestamps
    end

    add_index :repositories, :github_repo_id, unique: true
    add_index :repositories, :full_name
  end
end
