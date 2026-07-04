# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_06_29_194240) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "activities", force: :cascade do |t|
    t.string "action", null: false
    t.bigint "actor_id"
    t.datetime "created_at", null: false
    t.jsonb "metadata", default: {}, null: false
    t.bigint "subject_id", null: false
    t.string "subject_type", null: false
    t.datetime "updated_at", null: false
    t.index ["action"], name: "index_activities_on_action"
    t.index ["actor_id"], name: "index_activities_on_actor_id"
    t.index ["created_at"], name: "index_activities_on_created_at"
    t.index ["subject_type", "subject_id"], name: "index_activities_on_subject"
  end

  create_table "columns", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.integer "position", null: false
    t.bigint "project_id", null: false
    t.datetime "updated_at", null: false
    t.index ["project_id", "position"], name: "index_columns_on_project_id_and_position"
    t.index ["project_id"], name: "index_columns_on_project_id"
  end

  create_table "projects", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "key", null: false
    t.string "name", null: false
    t.integer "ticket_counter", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_projects_on_key", unique: true
  end

  create_table "pull_requests", force: :cascade do |t|
    t.string "author_login"
    t.datetime "created_at", null: false
    t.bigint "github_pr_id", null: false
    t.integer "pr_number", null: false
    t.bigint "repository_id", null: false
    t.string "state", default: "open", null: false
    t.bigint "ticket_id"
    t.string "title"
    t.datetime "updated_at", null: false
    t.string "url"
    t.index ["github_pr_id"], name: "index_pull_requests_on_github_pr_id", unique: true
    t.index ["repository_id"], name: "index_pull_requests_on_repository_id"
    t.index ["ticket_id"], name: "index_pull_requests_on_ticket_id"
  end

  create_table "repositories", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "full_name", null: false
    t.bigint "github_repo_id", null: false
    t.bigint "project_id", null: false
    t.datetime "updated_at", null: false
    t.index ["full_name"], name: "index_repositories_on_full_name"
    t.index ["github_repo_id"], name: "index_repositories_on_github_repo_id", unique: true
    t.index ["project_id"], name: "index_repositories_on_project_id"
  end

  create_table "tickets", force: :cascade do |t|
    t.text "archive_note"
    t.string "archive_reason"
    t.datetime "archived_at"
    t.bigint "archived_by_id"
    t.bigint "assignee_id"
    t.string "category", null: false
    t.bigint "column_id", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "position", null: false
    t.bigint "project_id", null: false
    t.bigint "reporter_id", null: false
    t.integer "ticket_number", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["archived_at"], name: "index_tickets_on_archived_at"
    t.index ["archived_by_id"], name: "index_tickets_on_archived_by_id"
    t.index ["assignee_id"], name: "index_tickets_on_assignee_id"
    t.index ["category"], name: "index_tickets_on_category"
    t.index ["column_id", "position"], name: "index_tickets_on_column_id_and_position"
    t.index ["column_id"], name: "index_tickets_on_column_id"
    t.index ["project_id", "ticket_number"], name: "index_tickets_on_project_id_and_ticket_number", unique: true
    t.index ["project_id"], name: "index_tickets_on_project_id"
    t.index ["reporter_id"], name: "index_tickets_on_reporter_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "avatar_url"
    t.datetime "created_at", null: false
    t.string "email"
    t.bigint "github_id", null: false
    t.string "github_login", null: false
    t.string "name"
    t.datetime "updated_at", null: false
    t.index ["github_id"], name: "index_users_on_github_id", unique: true
    t.index ["github_login"], name: "index_users_on_github_login"
  end

  add_foreign_key "activities", "users", column: "actor_id"
  add_foreign_key "columns", "projects"
  add_foreign_key "pull_requests", "repositories"
  add_foreign_key "pull_requests", "tickets"
  add_foreign_key "repositories", "projects"
  add_foreign_key "tickets", "columns"
  add_foreign_key "tickets", "projects"
  add_foreign_key "tickets", "users", column: "archived_by_id"
  add_foreign_key "tickets", "users", column: "assignee_id"
  add_foreign_key "tickets", "users", column: "reporter_id"
end
