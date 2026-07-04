class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :name
      t.string :email
      t.bigint :github_id, null: false
      t.string :github_login, null: false
      t.string :avatar_url

      t.timestamps
    end

    add_index :users, :github_id, unique: true
    add_index :users, :github_login
  end
end
