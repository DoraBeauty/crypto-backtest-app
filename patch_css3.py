import re

html_content = open("index.html").read()

# remove duplicate block
html_content = re.sub(r'\.event-reason-toggle \{\n.*?\.event-reason-content\.active \{\n            display: block;\n        \}\n', '', html_content, count=1, flags=re.DOTALL)

with open("index.html", "w") as f:
    f.write(html_content)
