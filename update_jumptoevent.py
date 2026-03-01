import re

with open('index.html', 'r') as f:
    content = f.read()

# Refactor jumpToEvent to just jump
jump_to_event_pattern = re.compile(
    r'(async function jumpToEvent\(dateString\) \{.*?\n\s+chart\.timeScale\(\)\.setVisibleRange\(\{ from: targetTime - visibleBefore, to: targetTime \+ visibleAfter \}\);).*?(?=\n\s+currentEventTime = targetTime;)',
    re.DOTALL
)

def replacement(match):
    # Only keep the zooming part
    return match.group(1) + "\n            // Note: We deliberately do not show the event card here anymore based on user feedback.\n            document.getElementById('event-overlay').classList.remove('active');\n"

new_content = jump_to_event_pattern.sub(replacement, content)

with open('index.html', 'w') as f:
    f.write(new_content)
