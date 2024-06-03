FROM python:3.10.14

COPY requirements.txt /requirements.txt
COPY main.py /main.py
COPY main.sh /main.sh

# RUN pip install -r /requirements.txt
ENTRYPOINT /main.sh "$INPUT_RUM-DATA" "$INPUT_CONVERSION-NAME" "$INPUT_CONVERSION-VALUE"
