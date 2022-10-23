g_ProjectInformation.productDescription.caption =
	setStringTags(translate("Millennium A.D. v0.26.0"), { "font": "sans-bold-16" }) + "\n\n" +
	translate("Notice: This mod is under development and many features have not been added yet.");

g_MainMenuItems[5].caption = translate("Atlas Scenario Editor");

g_CommunityButtons[0].tooltip = translate("Click to open https://0ad.mod.io/millenniumad in your web browser.");
g_CommunityButtons[0].onPress = () => {
	openURL("https://0ad.mod.io/millenniumad");
};