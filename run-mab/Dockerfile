FROM python:3.10.14

COPY requirements.txt /requirements.txt
COPY main.py /main.py
COPY main.sh /main.sh

# RUN pip install -r /requirements.txt
ENTRYPOINT /main.sh "$INPUT_RUM_DATA" "$INPUT_CONVERSION_NAME" "$INPUT_CONVERSION_VALUE"
