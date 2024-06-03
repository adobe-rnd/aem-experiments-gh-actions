def main(arg1):
    print('mab', arg1)
    return '{"some":"value"}'

if __name__ == '__main__':
    # test1.py executed as script
    # do something
    main(sys.argv[1])