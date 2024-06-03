FROM python:3.10.14
RUN mkdir /work
COPY requirements.txt /work/requirements.txt
COPY main.sh /work/main.sh
COPY main.py /work/main.py
WORKDIR /work
RUN pip install -r requirements.txt
CMD ['python3', './main.py']