import time


def research(topic):

    print(f"\n[Research] Gathering information about: {topic}")

    time.sleep(1)

    return f"Research notes about {topic}"


def structure(content):

    print("\n[Structure] Organizing ideas")

    time.sleep(1)

    return f"Structured outline from: {content}"


def draft(content):

    print("\n[Draft] Writing initial draft")

    time.sleep(1)

    return f"Draft article based on: {content}"


def refine(content):

    print("\n[Refine] Improving clarity and style")

    time.sleep(1)

    return f"Refined version of: {content}"


def publish(content):

    print("\n[Publish] Finalizing content")

    time.sleep(1)

    return f"Published content:\n\n{content}"