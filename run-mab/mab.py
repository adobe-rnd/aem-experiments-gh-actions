import sys
import pandas as pd
from mabwiser.mab import MAB, LearningPolicy

def display_expectations_for_tau(arms, decisions, rewards, custom_tau=0.1, verbose=1):
    _m = MAB(arms=arms, #[::-1], 
                    learning_policy=LearningPolicy.Softmax(tau=custom_tau), # ThompsonSampling(), #
                    seed=123456)
    _m.fit(
            decisions=decisions, 
            rewards=rewards)            
    
    arm_to_expecations = [(arm, round(percent,4)) for arm, percent in _m._imp.arm_to_expectation.items()]
    return dict(arm_to_expecations)

# Compute CTR
def compute_ctr(d, verbose=0):
    total_clicks = sum(d['clicks'].values())
    convert = sum(d['conversions'].values())
    ctr = round( total_clicks / d['views'] if total_clicks > 0 else 0, 6)
    convert_ctr = round(convert / d['views'] if convert > 0 else 0, 6)
    row = {'variant_name' : d['name'], 'pageviews': d['views'], 'clicks': total_clicks, 'ctr': ctr, 'conversions': convert, 'conversion_rate': convert_ctr}
    return pd.DataFrame([row])

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
    df = pd.DataFrame(columns=['variant_name', 'pageviews', 'clicks', 'ctr', 'conversions', 'conversion_rate'])
    for variant in rumData['variants']:
        row = compute_ctr(variant)
        df = pd.concat([df, row])

    df = df.sort_values(by='variant_name')

    arms = list(df["variant_name"])
    rewards = list(df['conversion_rate'])

    return display_expectations_for_tau(custom_tau=0.05, arms=arms, decisions=arms, rewards=rewards, verbose=0)

if __name__ == '__main__':
    # test1.py executed as script
    # do something
    main(sys.argv[1])