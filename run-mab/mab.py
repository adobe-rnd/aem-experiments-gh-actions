import sys

def main(rumData):
    print('RUM Data', rumData)
    # Format is:
    # {
    #   'experiment': 'Hero Copy and CTA Test',
    #   'variants': [
    #     {
    #       'name': 'challenger-2',
    #       'views': 2710,
    #       'clicks': {'.html-snippet': 20, '#lpclose': 140, '.grid-overlay #get-a-taste-of-our-mcollection': 10, '.grid-overlay': 100, '.header': 110, '#lpshroud': 20},
    #       'conversions': {'shop-m-bodywear': 70, 'shop-m-bras': 20, 'shop-m-underwear': 10}
    #     },
    #     {
    #       'name': 'challenger-6',
    #       'views': 2900,
    #       'clicks': {'.grid-overlay': 160, '#lpshroud': 10, '#lpclose': 320, '.html-snippet': 110, '.header': 10, '.meet-m-quick-links': 10},
    #       'conversions': {'shop-m-bodywear': 140, 'shop-m-bras': 20}
    #     },
    #     {
    #       'name': 'challenger-8',
    #       'views': 790,
    #       'clicks': {'.grid-overlay': 10, '.html-snippet': 20},
    #       'conversions': {'shop-m-bodywear': 10}
    #     },
    #     {
    #       'name': 'challenger-4',
    #       'views': 730,
    #       'clicks': {'.html-snippet': 10, '.grid-overlay': 120, '.footer-links': 10, '#lpclose': 10, '.footer-links #my-account': 10, '.footer-links #footer-links-1': 10},
    #       'conversions': {'shop-m-bodywear': 20, 'shop-m-bras': 100}
    #     },
    #     {
    #       'name': 'control',
    #       'views': 150,
    #       'clicks': {'.grid-overlay': 10},
    #       'conversions': {'shop-m-collection': 10}
    #     }
    #   ]
    # }

    # TODO: run MAB algorithm here

    # TODO: construct object like:
    # {
    #   'challenger-1': 13,
    #   'challenger-2': 4,
    #   'challenger-3': 31,
    #   'challenger-4': 5,
    #   'challenger-5': 13,
    #   'challenger-6': 5,
    #   'challenger-7': 12,
    #   'challenger-8': 7,
    #   'control': 10
    # }
    result = {}
    result['control'] = '34'
    result['challenger-1'] = '33'
    result['challenger-2'] = '33'
    return result

if __name__ == '__main__':
    # test1.py executed as script
    # do something
    main(sys.argv[1])