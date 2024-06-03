FROM python:3.10.14

COPY requirements.txt /work/requirements.txt
COPY main.py /work/main.py

RUN pip install -r requirements.txt
ENTRYPOINT ['python', './main.py']