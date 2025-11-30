from playwright.sync_api import sync_playwright

def verify_arcade(page):
    # Set a large viewport to see the whole cabinet
    page.set_viewport_size({"width": 1600, "height": 1200})

    # Go to the local server
    page.goto("http://localhost:8080")

    # Wait for the canvas
    page.wait_for_selector("#game-canvas")
    page.wait_for_timeout(2000)

    # Take a head-on screenshot
    page.screenshot(path="verification/arcade_front.png")

    # Rotate the cabinet using JS to see the side profile and depth
    page.evaluate("""
        document.querySelector('.arcade-cabinet').style.transform = 'rotateY(-25deg)';
    """)
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/arcade_side.png")

    # Test Input Animation
    # Press ArrowUp and see if joystick/button reacts
    page.keyboard.down("ArrowUp")
    page.wait_for_timeout(500)
    page.screenshot(path="verification/arcade_input_up.png")
    page.keyboard.up("ArrowUp")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_arcade(page)
        finally:
            browser.close()
