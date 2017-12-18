# AL Code Outline for Visual Studio Code

## Features

The AL Code Outline extension displays code outline tree of active AL file in the explorer pane. When you click on one of displayed tree items, code editor will move cursor to that item.  


![Code outline for a table](resources/screen-table.png)

![Code outline for a page](resources/screen-page.png)



## Settings

This extension contributes the following settings:

* `alOutline.autorefresh`: refresh code outline tree automatically

## Known Issues

- When AL project is opened in Visual Studio Code, AL Code Outline pane might not be visible even if one of *.al files is opened. You have to switch to another al file to display it.
- It takes some time to parse all *.al files when new project is opened so code outline will stay empty during that time. You can use Refresh button to force it to reload content. 
