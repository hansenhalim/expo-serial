import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Button, StyleSheet, Text, View, Alert } from "react-native";
import {
  DataBit,
  DriverType,
  FlowControl,
  Mode,
  Parity,
  ReturnedDataType,
  StopBit,
  initSerialport,
  useSerialport,
} from "@serserm/react-native-turbo-serialport";

initSerialport({
  autoConnect: true,
  mode: Mode.ASYNC,
  params: {
    driver: DriverType.CDC,
    portInterface: 1,
    returnedDataType: ReturnedDataType.UTF8,
    baudRate: 9600,
    dataBit: DataBit.DATA_BITS_8,
    stopBit: StopBit.STOP_BITS_1,
    parity: Parity.PARITY_NONE,
    flowControl: FlowControl.FLOW_CONTROL_OFF,
  },
});

export default function App() {
  const [connectedDevice, setConnectedDevice] = useState(null);
  let receiveBuffer = "";

  const serialport = useSerialport({
    onError: ({ errorCode, errorMessage }) => {
      console.log("Serial Error:", errorCode, errorMessage);
      Alert.alert("Serial Error", errorCode, errorMessage);
    },
    onReadData: ({ deviceId, portInterface, data }) => {
      if (portInterface !== 1) return;

      receiveBuffer += data;

      let index;
      while ((index = receiveBuffer.indexOf("\r\n")) !== -1) {
        const line = receiveBuffer.slice(0, index);
        const remaining = receiveBuffer.slice(index + 2);

        console.log(`Received from Device ${deviceId}, IF 1:`, line);

        receiveBuffer = remaining;
      }
    },
    onConnected: ({ deviceId, portInterface }) => {
      if (portInterface === 1) {
        console.log(`Connected to Device ${deviceId} on IF 1`);
        setConnectedDevice({ deviceId, portInterface });
      }
    },
    onDisconnected: ({ deviceId }) => {
      console.log("Device disconnected:", deviceId);
      setConnectedDevice(null);
    },
    onDeviceAttached: ({ deviceId }) => {
      console.log("Device attached:", deviceId);
    },
    onDeviceDetached: ({ deviceId }) => {
      console.log("Device detached:", deviceId);
    },
  });

  const sendCommand = (message) => {
    if (!connectedDevice) {
      Alert.alert("Not connected", "Please connect a device first.");
      return;
    }

    try {
      serialport.writeString(message + "\r\n", connectedDevice.deviceId, 1);
    } catch (err) {
      Alert.alert("Failed to send", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, connectedDevice && styles.connectedTitle]}>
        USB Serial LED Controller
      </Text>
      <Button title="LED ON" onPress={() => sendCommand("LED ON")} />
      <View style={{ height: 10 }} />
      <Button title="LED OFF" onPress={() => sendCommand("LED OFF")} />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    color: "white",
    marginBottom: 20,
    textAlign: "center",
  },
  connectedTitle: {
    color: "#00ff00",
    textShadowColor: "#00ff0088",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
