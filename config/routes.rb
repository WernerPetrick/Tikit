Rails.application.routes.draw do
  constraints(host: "127.0.0.1") do
    get "(*path)", to: redirect { |params, req| "#{req.protocol}localhost:#{req.port}/#{params[:path]}" }
  end

  # Auth
  get "login", to: "sessions#new", as: :login
  match "auth/github/callback", to: "sessions#create", via: %i[get post]
  match "auth/failure", to: "sessions#failure", via: %i[get post]
  delete "logout", to: "sessions#destroy", as: :logout
  post "dev_login", to: "sessions#dev_create", as: :dev_login # development only

  # Board (one per project). Root shows the default project's board (auth-locked).
  root "boards#show"
  resources :projects, only: %i[create destroy]
  get "projects/:project_id/board", to: "boards#show", as: :board

  resources :columns, only: %i[create update destroy] do
    collection { patch :reorder }
  end
  resources :tickets, only: %i[create update] do
    member do
      patch :move
      post :archive
      post :restore
    end
  end

  # GitHub App webhook (PR events). Signed server-to-server endpoint.
  post "webhooks/github", to: "webhooks/github#create"

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  get "up" => "rails/health#show", as: :rails_health_check
end
