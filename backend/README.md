# edmap-app-backend

## Run the project

This project is a back-end template and can be used for various front-end service. It utilizes the `Django Rest Framework` and has an API.

The project uses the Python version `3.12.2`

To run locally:

- Configure `.env` file with corresponding api urls

  ```
  DJANGO_APP_MODE= "local"
  DJANGO_APP_DEBUG = True
  DJANGO_APP_SECRET_KEY = "hello-world-very-very-secret-key"
  DJANGO_APP_ALLOWED_HOSTS = "http://127.0.0.1, http://localhost:8000, localhost:8000, 127.0.0.1:8000"
  DJANGO_APP_CORS_ORIGINS = "http://localhost:5175, http://localhost:5173"

  DJANGO_APP_GROQ_API_KEY = "ask_for_groq_key"

  PYTHON_VERSION = "3.12.2"
  ```

- Create the python virtual environment

  ```
     python3.12.2 -m venv .penv

  ```

- Activate the env

  ```
      source ./penv/bin/activate

  ```

- Upgrade the pip

  ```
      pip install --upgrade pip

  ```

* `cd` into the src folder. Install the requirements

  ```
      pip install -r requirements.txt

  ```

* Migrate, makemigrations, migrate!

  ```
      python manage.py migrate

      python manage.py makemigrations

      python manage.py migrate

  ```

* Create the super user

  ```
      python manage.py createsuperuser

  ```

* Run the local server

  ```
      python manage.py runserver
  ```

This will run the server on `localhost:8000`

You can change it by passing the IP and the port as an argument after the runserver command.

For the development database we're using the standard `SQLite` db, but in the production we set it up the `PostgreSQL` db. If you're going to run this on the production, make sure to change the db settings in the settings_prod.py file and also add the allowed hosts and whitelist the origins.

You can checkout the DigitalOcean's articles on

[how to install and run django locally](https://www.digitalocean.com/community/tutorials/how-to-set-up-django-with-postgres-nginx-and-gunicorn-on-ubuntu-16-04)
