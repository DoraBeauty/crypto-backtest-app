html_content = open("index.html").read()
css_to_add = """
        .event-reason-toggle {
            margin-top: 10px;
            padding: 5px 10px;
            background-color: rgba(41, 98, 255, 0.2);
            color: #2962FF;
            border: 1px solid rgba(41, 98, 255, 0.5);
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            width: 100%;
            transition: all 0.2s;
            display: block;
        }
        .event-reason-toggle:hover {
            background-color: rgba(41, 98, 255, 0.4);
        }
        .event-reason-content {
            display: none;
            margin-top: 5px;
            margin-bottom: 10px;
            padding: 10px;
            background-color: rgba(20, 24, 34, 0.8);
            border: 1px solid #434651;
            border-radius: 6px;
            font-size: 12px;
            color: #d1d4dc;
            text-align: left;
            line-height: 1.5;
            max-width: 250px;
            word-wrap: break-word;
            max-height: 150px;
            overflow-y: auto;
        }
        .event-reason-content.active {
            display: block;
        }
"""
if ".event-reason-toggle" not in html_content:
    html_content = html_content.replace('/* Event Overlay Styles */', css_to_add + '\n        /* Event Overlay Styles */')
    with open("index.html", "w") as f:
        f.write(html_content)
    print("CSS patched")
