FROM python:3.10.14

COPY requirements.txt /requirements.txt
COPY main.py /main.py

RUN pip install -r /requirements.txt
ENTRYPOINT ['/main.py']