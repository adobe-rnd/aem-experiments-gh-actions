FROM python:3.10.14

COPY requirements.txt /requirements.txt
RUN pip install -r /requirements.txt

COPY mab.py /mab.py
COPY main.py /main.py

ENTRYPOINT /main.py "$INPUT_RUM_DATA" "$INPUT_CONVERSION_NAME" "$INPUT_CONVERSION_VALUE"
