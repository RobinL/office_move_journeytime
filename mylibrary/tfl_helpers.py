import json
import traceback
import sys
import requests



def status_of_tfl_response_places(content):

    try:
        parsed_response = json.loads(content)
    except Exception, err:
        print(traceback.format_exc())
        return "error: json could not be parsed"

    try:
        if "message" in parsed_response:
            return parsed_response["message"]

        if len(parsed_response["places"]) ==0:
            return "no icscodes found"

        return "ok"
    except Exception, err:
        print(traceback.format_exc())
        return "unknown error"

def status_of_tfl_response_journey(content):
    try:
        parsed_response = json.loads(content)
    except Exception, err:
        print(traceback.format_exc())
        return "error: json could not be parsed"


    try:
        if "message" in parsed_response:
            return parsed_response["message"]

        if "journeys" in parsed_response:
            return "no journies found"

        return "ok"
    except Exception, err:
        print(traceback.format_exc())
        return "unknown error"




def get_journeyplanner_raw_content(params_dict) :
    
    full_str = "".join([r"https://api.tfl.gov.uk/Journey/JourneyResults/{from}/to/{to}?",
    r"nationalSearch={nationalsearch}",
    r"&timeIs=Departing",
    r"&journeyPreference=LeastTime",
    r"&time={time}",
    r"&date={date}",
    r"&app_id={id}",
    r"&app_key={key}"])

    url = full_str.format(**params_dict)
    r = requests.get(url)
    return r.content, url

def get_journeyplanner_results(param_dicts):
    
    #If no journeys are found, try again with a different param dict  
    p_dict_iter = iter(param_dicts)
    param_dict = p_dict_iter.next()

    #Try 5 times before giving up 
    for i in range(5):
        journey_json, url = get_journeyplanner_raw_content(param_dict)
        tfl_message = status_of_tfl_response_journey(journey_json)
        if tfl_message == 'ok':
            break
        if tfl_message != "No journey found for your inputs.":
            try:
                param_dict = p_dict_iter.next()
            except:
                break
    try:
        journey = json.loads(journey_json)
    except:
        return {"tfl_response" : journey_json, "query_dict": json.dumps(param_dict), "request_url": url, "journey":"", "tfl_message": "couldn't decode json"}

    if "journeys" in journey:
        return {"tfl_response" : journey_json, "query_dict": json.dumps(param_dict), "request_url": url, "journey":journey, "tfl_message": "ok"}
        
    if "message" in journey:
        return {"tfl_response" : journey_json, "query_dict": json.dumps(param_dict), "request_url": url, "journey":journey, "tfl_message": journey["message"]}

    return {"tfl_response" : journey_json, "query_dict": json.dumps(param_dict), "request_url": url, "journey":journey, "tfl_message": "unknown error"}
