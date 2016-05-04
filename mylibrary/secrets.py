import json
with open("./.env") as f:
    env = json.load(f)
app_id = env["app_id"]
app_key = env["app_key"]
orig_name = env["orig_name"]
dest_name = env["dest_name"]
orig_pc = env["orig_pc"]
dest_pc = env["dest_pc"]