import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { checkIfLoggedIn } from "./functions/checkIfLoggedIn";
import Tts from 'react-native-tts';

const ListenPageTools = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [playbackPosition, setPlaybackPosition] = useState(0);
    const [playbackDuration, setPlaybackDuration] = useState(300);
    useEffect(() => {
        setTimeout(async () => {
            const isLoggedIn = await checkIfLoggedIn();
        }, 100);
    }, [])
    const togglePlayPause = () => {
        if (isPlaying) {
            stopPlaying();
        } else {
            startPlaying(playbackSpeed);
        };
        setIsPlaying((prevState) => !prevState);

    };
    const startPlaying = (playbackSpeed) => {
        const speak = (text) => {
            const utterance = new SpeechSynthesisUtterance(text);

            utterance.rate = playbackSpeed; // Adjust playback speed if needed
            console.log("Utterance Rate: ", playbackSpeed);
            window.speechSynthesis.speak(utterance);
        };
        speak("It's not his fault. I know you're going to want to, but you can't blame him. He really has no idea how it happened. I kept trying to come up with excuses I could say to mom that would keep her calm when she found out what happened, but the more I tried, the more I could see none of them would work. He was going to get her wrath and there was nothing I could say to prevent it.");

    }
    const stopPlaying = () => {
        window.speechSynthesis.cancel();
    }

    useEffect(() => {
        if (isPlaying) {
            stopPlaying();
            startPlaying(playbackSpeed);
        }
    }, [playbackSpeed])

    const changeSpeed = () => {
        const newSpeed = playbackSpeed === 2 ? 1 : playbackSpeed + 0.25;
        setPlaybackSpeed(newSpeed);

    };

    const onSliderChange = (value) => {
        setPlaybackPosition(value);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        checkIfGobackInfoAvailable(navigation) ?
                            navigation.goBack() :
                            navigation.navigate("Explore")
                    }}
                >
                    <FontAwesome name="arrow-left" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Title</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.text}>
                    Lorem ipsum odor amet, consectetur adipiscing elit. Vestibulum arcu
                    rhoncus ornare condimentum ultrices...
                </Text>
            </View>

            <View style={styles.mediaControlsContainer}>
                <View style={styles.mediaControls}>
                    <TouchableOpacity>
                        <MaterialIcons name="replay-10" size={36} color="#4A4A4A" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.playPauseButton}
                        onPress={togglePlayPause}
                    >
                        {isPlaying ? (
                            <FontAwesome name="pause" size={36} color="white" />
                        ) : (
                            <FontAwesome name="play" size={36} color="white" />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity>
                        <MaterialIcons name="forward-10" size={36} color="#4A4A4A" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.speedControl} onPress={changeSpeed}>
                        <Text style={styles.speedText}>{playbackSpeed}x</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.sliderContainer}>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={playbackDuration}
                        value={playbackPosition}
                        onValueChange={onSliderChange}
                        minimumTrackTintColor="#057B34"
                        maximumTrackTintColor="#d3d3d3"
                        thumbTintColor="#057B34"
                    />
                    <View style={styles.timeContainer}>
                        <Text style={styles.timeText}>{formatTime(playbackPosition)}</Text>
                        <Text style={styles.timeText}>{formatTime(playbackDuration)}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#ffffff",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 50,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginLeft: 10,
    },
    content: {
        flex: 1,
        marginBottom: 20,
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
        color: "#333333",
    },
    mediaControlsContainer: {
        backgroundColor: "#f0f0f0",
        padding: 20,
        borderRadius: 10,
    },
    mediaControls: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    playPauseButton: {
        backgroundColor: "#057B34",
        borderRadius: 50,
        padding: 15,
    },
    speedControl: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: "#ffffff",
        borderRadius: 5,
        borderWidth: 1,
        borderColor: "#4A4A4A",
    },
    speedText: {
        color: "#4A4A4A",
        fontWeight: "bold",
    },
    sliderContainer: {
        marginTop: 20,
    },
    slider: {
        width: "100%",
        height: 40,
    },
    timeContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    timeText: {
        fontSize: 14,
        color: "#4A4A4A",
    },
});

export default ListenPageTools;
